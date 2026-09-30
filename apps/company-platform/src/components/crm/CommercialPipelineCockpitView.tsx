import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Spinner,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';

export interface PipelineItem {
  partnerId: string;
  tenantId: string;
  legalName: string;
  tradeName: string;
  partnerType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  isVerified: boolean;
  registrationDate: string;
  subscription: {
    id: string;
    planId: string;
    planName: string;
    planCode: string;
    annualBasePriceInr: number;
    billingCycle: string;
    status: string;
    startDate: string;
    endDate: string;
    renewalDate: string;
    isFirstYearFree: boolean;
  } | null;
  license: {
    id: string;
    licenseKey: string;
    status: string;
    daysRemaining: number;
    expiryDate: string;
    gracePeriodEnd: string | null;
    isAccessAllowed: boolean;
  } | null;
  paymentStatus: 'PAID' | 'NOT_PAID' | 'FREE_PERIOD' | 'PENDING' | 'FAILED' | 'NEVER_PAID';
  licenseStatus: string;
  stage: 'TRIAL_365' | 'RENEWAL_60D' | 'EXPIRING_30D' | 'GRACE_PERIOD' | 'LOCKED' | 'RENEWED';
  totalPaidAmountInr: number;
  lastPayment: {
    date: string;
    method: string;
    transactionReference: string;
    amountInr: number;
  } | null;
  nextRenewalDate: string | null;
  assignedHqOwner: string;
  lastActivityAt: string;
  latestSnapshotId: string | null;
  createdAt: string;
}

export interface PipelineMetrics {
  totalPartners: number;
  filteredCount: number;
  totalFree: number;
  totalPaid: number;
  totalPaymentPending: number;
  totalRenewalDue: number;
  totalExpiringSoon: number;
  totalExpired: number;
  totalLocked: number;
  totalNeverPaid: number;
  totalRevenueInr: number;
}

export const CommercialPipelineCockpitView: React.FC = () => {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [compoundFilter, setCompoundFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<string>('ALL');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('TABLE');

  // Modals & Drawers
  const [graceModalPartner, setGraceModalPartner] = useState<PipelineItem | null>(null);
  const [graceDays, setGraceDays] = useState<number>(7);
  const [graceReason, setGraceReason] = useState<string>('HQ Commercial Courtesy Extension');
  const [isSubmittingGrace, setIsSubmittingGrace] = useState<boolean>(false);

  const [offlineModalPartner, setOfflineModalPartner] = useState<PipelineItem | null>(null);
  const [offlineDurationYears, setOfflineDurationYears] = useState<number>(1);
  const [offlineMethod, setOfflineMethod] = useState<string>('NEFT');
  const [offlineTxRef, setOfflineTxRef] = useState<string>('');
  const [offlineNotes, setOfflineNotes] = useState<string>('Settlement verified via corporate bank ledger');
  const [isSubmittingOffline, setIsSubmittingOffline] = useState<boolean>(false);

  // 7-Section Commercial Detail Drawer
  const [detailPartnerId, setDetailPartnerId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<
    'IDENTITY' | 'COMMERCIAL' | 'LICENSE' | 'PAYMENTS' | 'INVOICES' | 'ENTITLEMENTS' | 'AUDIT'
  >('IDENTITY');

  // Plan Management Drawer
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = useState<boolean>(false);
  const [catalogPlans, setCatalogPlans] = useState<any[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanPrice, setEditingPlanPrice] = useState<number>(6000);
  const [editingPlanName, setEditingPlanName] = useState<string>('');
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  // Partner Types Drawer
  const [isTypesDrawerOpen, setIsTypesDrawerOpen] = useState<boolean>(false);
  const [partnerTypesList, setPartnerTypesList] = useState<any[]>([]);
  const [newTypeCode, setNewTypeCode] = useState<string>('');
  const [newTypeLabel, setNewTypeLabel] = useState<string>('');
  const [newTypeIcon, setNewTypeIcon] = useState<string>('🏥');
  const [newTypeDefaultPlan, setNewTypeDefaultPlan] = useState<string>('PLAN_SOLO_CLINIC_ANNUAL');
  const [isSavingType, setIsSavingType] = useState<boolean>(false);

  const fetchPipeline = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (compoundFilter && compoundFilter !== 'ALL') params.append('compoundFilter', compoundFilter);
      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') params.append('paymentStatus', paymentStatusFilter);
      if (licenseStatusFilter && licenseStatusFilter !== 'ALL') params.append('licenseStatus', licenseStatusFilter);
      if (partnerTypeFilter && partnerTypeFilter !== 'ALL') params.append('partnerType', partnerTypeFilter);
      if (stageFilter && stageFilter !== 'ALL') params.append('stage', stageFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/commercial/hq/pipeline?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setItems(json.data.items || []);
        setMetrics(json.data.metrics || null);
      } else {
        setErrorMessage(json.message || 'Failed to load commercial pipeline data.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching commercial pipeline.');
    } finally {
      setIsLoading(false);
    }
  }, [compoundFilter, paymentStatusFilter, licenseStatusFilter, partnerTypeFilter, stageFilter, searchQuery]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Fetch Partner 360 Detail Dossier
  const openDetailDrawer = async (partnerId: string) => {
    setDetailPartnerId(partnerId);
    setIsLoadingDetail(true);
    setDetailData(null);
    setActiveDetailTab('IDENTITY');
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/commercial/hq/partner/${partnerId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDetailData(json.data);
      } else {
        setErrorMessage(json.message || 'Failed to fetch partner commercial details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching partner commercial details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Fetch Plans for Plan Drawer
  const fetchCatalogPlans = async () => {
    try {
      const res = await fetch('/api/v1/commercial/plans');
      const json = await res.json();
      if (res.ok && json.success) {
        setCatalogPlans(json.data || []);
      }
    } catch {
      // Silent error
    }
  };

  useEffect(() => {
    if (isPlanDrawerOpen) {
      fetchCatalogPlans();
    }
  }, [isPlanDrawerOpen]);

  // Fetch Partner Types for Types Drawer
  const fetchPartnerTypes = async () => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;
      const res = await fetch('/api/v1/commercial/hq/partner-types', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPartnerTypesList(json.data || []);
      }
    } catch {
      // Silent error
    }
  };

  useEffect(() => {
    if (isTypesDrawerOpen) {
      fetchPartnerTypes();
    }
  }, [isTypesDrawerOpen]);

  // Handle Grace Extension
  const handleExtendGraceSubmit = async () => {
    if (!graceModalPartner) return;
    setIsSubmittingGrace(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch('/api/v1/commercial/hq/extend-grace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          partnerId: graceModalPartner.partnerId,
          additionalDays: graceDays,
          reason: graceReason
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(`Successfully granted +${graceDays} days grace to ${graceModalPartner.tradeName}.`);
        setGraceModalPartner(null);
        fetchPipeline();
      } else {
        setErrorMessage(json.message || 'Failed to extend grace period.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error submitting grace extension.');
    } finally {
      setIsSubmittingGrace(false);
    }
  };

  // Handle Offline Payment
  const handleRecordOfflineSubmit = async () => {
    if (!offlineModalPartner || !offlineModalPartner.subscription) return;
    if (!offlineTxRef.trim()) {
      setErrorMessage('Transaction reference / UTR number is required for bank reconciliation.');
      return;
    }
    setIsSubmittingOffline(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch('/api/v1/commercial/hq/record-offline-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          partnerId: offlineModalPartner.partnerId,
          planId: offlineModalPartner.subscription.planId,
          durationYears: offlineDurationYears,
          paymentMethod: offlineMethod,
          transactionReference: offlineTxRef.trim(),
          notes: offlineNotes,
          customerBillingAddress: offlineModalPartner.legalName
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(`Payment recorded successfully for ${offlineModalPartner.tradeName}! License extended & B2B invoice generated.`);
        setOfflineModalPartner(null);
        setOfflineTxRef('');
        fetchPipeline();
      } else {
        setErrorMessage(json.message || 'Failed to record offline payment.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error recording offline payment.');
    } finally {
      setIsSubmittingOffline(false);
    }
  };

  // Handle Plan Edit
  const handleUpdatePlan = async (planId: string) => {
    setIsSavingPlan(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/commercial/hq/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: editingPlanName,
          annualBasePriceInr: editingPlanPrice
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage('Plan updated successfully! Immutable price version created.');
        setEditingPlanId(null);
        fetchCatalogPlans();
        fetchPipeline();
      } else {
        setErrorMessage(json.message || 'Failed to update plan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error updating plan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Handle Plan Archive
  const handleArchivePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to soft-delete / archive this plan? Historical orders remain protected.')) {
      return;
    }
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch(`/api/v1/commercial/hq/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage('Plan safely archived.');
        fetchCatalogPlans();
      } else {
        setErrorMessage(json.message || 'Failed to archive plan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error archiving plan.');
    }
  };

  // Handle Create Partner Type
  const handleCreatePartnerType = async () => {
    if (!newTypeCode.trim() || !newTypeLabel.trim()) {
      setErrorMessage('Classification code and label are required.');
      return;
    }
    setIsSavingType(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('docsearch_company_token') || localStorage.getItem('docsearch_auth_token'))
        : null;

      const res = await fetch('/api/v1/commercial/hq/partner-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code: newTypeCode.trim().toUpperCase(),
          label: newTypeLabel.trim(),
          icon: newTypeIcon,
          defaultPlanCode: newTypeDefaultPlan
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(`Partner type ${newTypeCode} created successfully.`);
        setNewTypeCode('');
        setNewTypeLabel('');
        fetchPartnerTypes();
      } else {
        setErrorMessage(json.message || 'Failed to create partner type.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error creating partner type.');
    } finally {
      setIsSavingType(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setCompoundFilter('ALL');
    setPaymentStatusFilter('ALL');
    setLicenseStatusFilter('ALL');
    setPartnerTypeFilter('ALL');
    setStageFilter('ALL');
    setSearchQuery('');
  };

  // Kanban Stage Columns
  const kanbanColumns = useMemo(() => {
    const cols: Record<string, PipelineItem[]> = {
      TRIAL_365: [],
      RENEWAL_60D: [],
      EXPIRING_30D: [],
      GRACE_PERIOD: [],
      LOCKED: [],
      RENEWED: []
    };

    items.forEach((item) => {
      const target = cols[item.stage] || cols['TRIAL_365'];
      if (target) {
        target.push(item);
      }
    });

    return cols;
  }, [items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* ── Top Header Ribbon ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '20px 24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>💳</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
                HQ Commercial Control Plane
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Server-authoritative pipeline, &quot;Who Paid vs Not Paid&quot; analytics, GST pricing catalog &amp; discretionary controls
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={() => setIsTypesDrawerOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🏥 <span>Partner Types</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsPlanDrawerOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ⚙️ <span>Plans &amp; Pricing</span>
          </Button>
          <Button
            variant="primary"
            onClick={fetchPipeline}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 <span>Sync Pipeline</span>
          </Button>
        </div>
      </div>

      {/* ── 9 Interactive KPI Summary Cards (Section 23) ────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}
      >
        {/* Card 1: TOTAL PARTNERS */}
        <div
          onClick={resetFilters}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: '#0F172A',
            border: compoundFilter === 'ALL' && paymentStatusFilter === 'ALL' ? '2px solid #38BDF8' : '1px solid #1E293B',
            borderRadius: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>TOTAL PARTNERS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
            {metrics?.totalPartners ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>All ecosystem</div>
        </div>

        {/* Card 2: 365-DAY FREE */}
        <div
          onClick={() => {
            setCompoundFilter('ALL');
            setPaymentStatusFilter('FREE_PERIOD');
            setStageFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: paymentStatusFilter === 'FREE_PERIOD' ? '2px solid #38BDF8' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38BDF8' }}>365-DAY FREE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
            {metrics?.totalFree ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#38BDF8', marginTop: '2px' }}>Initial promo</div>
        </div>

        {/* Card 3: PAID ACTIVE */}
        <div
          onClick={() => {
            setCompoundFilter('CURRENTLY_PAID');
            setPaymentStatusFilter('PAID');
            setStageFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: paymentStatusFilter === 'PAID' ? '2px solid #10B981' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34D399' }}>PAID ACTIVE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
            {metrics?.totalPaid ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#A7F3D0', marginTop: '2px' }}>
            ₹{(metrics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 4: PAYMENT PENDING */}
        <div
          onClick={() => {
            setCompoundFilter('ALL');
            setPaymentStatusFilter('PENDING');
            setStageFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: paymentStatusFilter === 'PENDING' ? '2px solid #EAB308' : '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FACC15' }}>PAYMENT PENDING</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EAB308', marginTop: '2px' }}>
            {metrics?.totalPaymentPending ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#FEF08A', marginTop: '2px' }}>Open checkout</div>
        </div>

        {/* Card 5: RENEWAL DUE (≤60D) */}
        <div
          onClick={() => {
            setCompoundFilter('ALL');
            setStageFilter('RENEWAL_60D');
            setPaymentStatusFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(147, 51, 234, 0.08)',
            border: stageFilter === 'RENEWAL_60D' ? '2px solid #A855F7' : '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C084FC' }}>RENEWAL DUE (≤60D)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#A855F7', marginTop: '2px' }}>
            {metrics?.totalRenewalDue ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#E9D5FF', marginTop: '2px' }}>Window open</div>
        </div>

        {/* Card 6: EXPIRING SOON (≤30D) */}
        <div
          onClick={() => {
            setCompoundFilter('ALL');
            setStageFilter('EXPIRING_30D');
            setPaymentStatusFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: stageFilter === 'EXPIRING_30D' ? '2px solid #F59E0B' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FBBF24' }}>EXPIRING ≤30D</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
            {metrics?.totalExpiringSoon ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#FDE68A', marginTop: '2px' }}>High urgency</div>
        </div>

        {/* Card 7: EXPIRED / GRACE */}
        <div
          onClick={() => {
            setCompoundFilter('ALL');
            setStageFilter('GRACE_PERIOD');
            setPaymentStatusFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(249, 115, 22, 0.08)',
            border: stageFilter === 'GRACE_PERIOD' ? '2px solid #F97316' : '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FB923C' }}>EXPIRED / GRACE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EA580C', marginTop: '2px' }}>
            {metrics?.totalExpired ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#FED7AA', marginTop: '2px' }}>Grace buffer</div>
        </div>

        {/* Card 8: HARD LOCKED */}
        <div
          onClick={() => {
            setCompoundFilter('LOCKED_UNPAID');
            setStageFilter('LOCKED');
            setPaymentStatusFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: stageFilter === 'LOCKED' ? '2px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F87171' }}>HARD LOCKED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444', marginTop: '2px' }}>
            {metrics?.totalLocked ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#FECACA', marginTop: '2px' }}>Read-only lock</div>
        </div>

        {/* Card 9: NEVER PAID */}
        <div
          onClick={() => {
            setCompoundFilter('NEVER_PAID');
            setPaymentStatusFilter('NEVER_PAID');
            setStageFilter('ALL');
          }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            backgroundColor: 'rgba(100, 116, 139, 0.08)',
            border: compoundFilter === 'NEVER_PAID' ? '2px solid #94A3B8' : '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '8px'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#CBD5E1' }}>NEVER PAID</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94A3B8', marginTop: '2px' }}>
            {metrics?.totalNeverPaid ?? 0}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>Zero payment</div>
        </div>
      </div>

      {/* ── Toast Alerts ────────────────────────────────────────────── */}
      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            color: '#A7F3D0',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #EF4444',
            color: '#FCA5A5',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>✗ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Filter Toolbar ─────────────────────────────────────────── */}
      <Card style={{ padding: '16px 20px', backgroundColor: '#0F172A', border: '1px solid #1E293B' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', flex: 1 }}>
            {/* Search Input */}
            <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
              <Input
                placeholder="Search partner, doctor, phone, email, license key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Compound Filter Dropdown ("Who Paid / Who Did Not Pay") */}
            <div style={{ minWidth: '190px' }}>
              <Select
                value={compoundFilter}
                onChange={(e) => setCompoundFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: '⚡ All Pipeline Views' },
                  { value: 'FREE_EXPIRED_UNPAID', label: '⚠️ Free Expired & Unpaid' },
                  { value: 'EXPIRING_60D_NEVER_PAID', label: '⏳ Expiring ≤60D & Never Paid' },
                  { value: 'PAYMENT_FAILED_ACTIVE', label: '❌ Payment Failed (Active)' },
                  { value: 'CURRENTLY_PAID', label: '✅ Active Paid Subscribers' },
                  { value: 'NEVER_PAID', label: '🚫 Never Paid' },
                  { value: 'LOCKED_UNPAID', label: '🔒 Hard Locked' }
                ]}
              />
            </div>

            {/* Payment Filter */}
            <div style={{ minWidth: '140px' }}>
              <Select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: '💳 All Payments' },
                  { value: 'PAID', label: '✅ Paid' },
                  { value: 'NOT_PAID', label: '❌ Unpaid' },
                  { value: 'PENDING', label: '⏳ Pending' },
                  { value: 'FREE_PERIOD', label: '🎁 365-Day Free' },
                  { value: 'NEVER_PAID', label: '🚫 Never Paid' }
                ]}
              />
            </div>

            {/* Partner Type Filter */}
            <div style={{ minWidth: '160px' }}>
              <Select
                value={partnerTypeFilter}
                onChange={(e) => setPartnerTypeFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: '🏥 All Types' },
                  { value: 'SOLO_CLINIC', label: '🩺 Solo Clinic (₹6k)' },
                  { value: 'PATHOLOGY', label: '🧪 Pathology (₹6k)' },
                  { value: 'PHARMACY', label: '💊 Pharmacy (₹6k)' },
                  { value: 'HOSPITAL_NETWORK', label: '🏥 Hospital (₹20k)' }
                ]}
              />
            </div>

            {/* Stage Filter */}
            <div style={{ minWidth: '150px' }}>
              <Select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: '🔄 All Stages' },
                  { value: 'TRIAL_365', label: '1. Free Trial' },
                  { value: 'RENEWAL_60D', label: '2. Renewal (60d)' },
                  { value: 'EXPIRING_30D', label: '3. Countdown (30d)' },
                  { value: 'GRACE_PERIOD', label: '4. Grace Period' },
                  { value: 'LOCKED', label: '5. Locked' },
                  { value: 'RENEWED', label: '6. Paid / Renewed' }
                ]}
              />
            </div>

            {/* Reset Filters */}
            <Button size="sm" variant="ghost" onClick={resetFilters} style={{ color: '#94A3B8' }}>
              ✕ Reset
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: viewMode === 'TABLE' ? 700 : 500,
                color: viewMode === 'TABLE' ? '#FFFFFF' : '#94A3B8',
                backgroundColor: viewMode === 'TABLE' ? '#0284C7' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📋 17-Col Table
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: viewMode === 'KANBAN' ? 700 : 500,
                color: viewMode === 'KANBAN' ? '#FFFFFF' : '#94A3B8',
                backgroundColor: viewMode === 'KANBAN' ? '#0284C7' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📊 Kanban
            </button>
          </div>
        </div>
      </Card>

      {/* ── Loading Spinner ─────────────────────────────────────────── */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spinner size="lg" />
        </div>
      )}

      {/* ── View 1: 17-Column Operational Table (Section 7) ──────────── */}
      {!isLoading && viewMode === 'TABLE' && (
        <TableContainer style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner &amp; Facility</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Free Period</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>License Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Next Renewal</TableHead>
                <TableHead>HQ Owner</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={17} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No commercial partner records found matching active filters.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((partner) => (
                  <TableRow
                    key={partner.partnerId}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onClick={() => openDetailDrawer(partner.partnerId)}
                  >
                    {/* 1. Partner */}
                    <TableCell>
                      <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{partner.tradeName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{partner.legalName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {partner.primaryContactName} ({partner.primaryContactPhone})
                      </div>
                    </TableCell>

                    {/* 2. Type */}
                    <TableCell>
                      <Badge variant="neutral">{partner.partnerType}</Badge>
                    </TableCell>

                    {/* 3. Plan */}
                    <TableCell>
                      <div style={{ fontWeight: 700, color: '#F1F5F9' }}>
                        {partner.subscription?.planName || 'Standard'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                        ₹{(partner.subscription?.annualBasePriceInr || 6000).toLocaleString('en-IN')}/yr
                      </div>
                    </TableCell>

                    {/* 4. Registered */}
                    <TableCell>
                      <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                        {partner.registrationDate ? new Date(partner.registrationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>

                    {/* 5. Free Period */}
                    <TableCell>
                      {partner.subscription?.isFirstYearFree ? (
                        <Badge variant="primary">365D FREE</Badge>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Standard</span>
                      )}
                    </TableCell>

                    {/* 6. Subscription */}
                    <TableCell>
                      <Badge variant={partner.subscription?.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {partner.subscription?.status || 'NONE'}
                      </Badge>
                    </TableCell>

                    {/* 7. Payment Status */}
                    <TableCell>
                      {partner.paymentStatus === 'PAID' ? (
                        <Badge variant="success">PAID (₹{partner.totalPaidAmountInr.toLocaleString('en-IN')})</Badge>
                      ) : partner.paymentStatus === 'FREE_PERIOD' ? (
                        <Badge variant="primary">FREE PERIOD</Badge>
                      ) : partner.paymentStatus === 'PENDING' ? (
                        <Badge variant="warning">PENDING</Badge>
                      ) : partner.paymentStatus === 'FAILED' ? (
                        <Badge variant="danger">FAILED</Badge>
                      ) : (
                        <Badge variant="danger">NEVER PAID</Badge>
                      )}
                    </TableCell>

                    {/* 8. License Status */}
                    <TableCell>
                      <Badge
                        variant={
                          partner.licenseStatus === 'ACTIVE' ? 'success' :
                          partner.licenseStatus === 'LOCKED' ? 'danger' :
                          partner.licenseStatus === 'GRACE_PERIOD' ? 'warning' : 'neutral'
                        }
                      >
                        {partner.licenseStatus || 'N/A'}
                      </Badge>
                    </TableCell>

                    {/* 9. Start Date */}
                    <TableCell>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {partner.subscription?.startDate ? new Date(partner.subscription.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>

                    {/* 10. Expiry Date */}
                    <TableCell>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>
                        {partner.license?.expiryDate ? new Date(partner.license.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>

                    {/* 11. Days Remaining */}
                    <TableCell>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: (partner.license?.daysRemaining ?? 0) <= 30 ? '#F87171' : '#38BDF8'
                        }}
                      >
                        {partner.license?.daysRemaining ?? 0}d
                      </span>
                    </TableCell>

                    {/* 12. Amount */}
                    <TableCell>
                      <span style={{ fontWeight: 700, color: '#F1F5F9' }}>
                        ₹{(partner.totalPaidAmountInr > 0 ? partner.totalPaidAmountInr : (partner.subscription?.annualBasePriceInr || 6000)).toLocaleString('en-IN')}
                      </span>
                    </TableCell>

                    {/* 13. Last Payment */}
                    <TableCell>
                      {partner.lastPayment ? (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399' }}>
                            ₹{partner.lastPayment.amountInr.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {partner.lastPayment.method} • {new Date(partner.lastPayment.date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>None</span>
                      )}
                    </TableCell>

                    {/* 14. Next Renewal */}
                    <TableCell>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {partner.nextRenewalDate ? new Date(partner.nextRenewalDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>

                    {/* 15. HQ Owner */}
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{partner.assignedHqOwner}</span>
                    </TableCell>

                    {/* 16. Last Activity */}
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {partner.lastActivityAt ? new Date(partner.lastActivityAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>

                    {/* 17. Actions */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailDrawer(partner.partnerId)}
                          style={{ color: '#38BDF8', borderColor: '#0284C7' }}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setGraceModalPartner(partner)}
                        >
                          Grace
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setOfflineModalPartner(partner)}
                        >
                          Offline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── View 2: Kanban View ──────────────────────────────────────── */}
      {!isLoading && viewMode === 'KANBAN' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { key: 'TRIAL_365', label: '1. 365-Day Free Trial', color: '#38BDF8' },
            { key: 'RENEWAL_60D', label: '2. Renewal Window (≤60D)', color: '#A855F7' },
            { key: 'EXPIRING_30D', label: '3. Countdown (≤30D)', color: '#F59E0B' },
            { key: 'GRACE_PERIOD', label: '4. Grace Buffer', color: '#F97316' },
            { key: 'LOCKED', label: '5. Hard Locked', color: '#EF4444' },
            { key: 'RENEWED', label: '6. Active Paid / Renewed', color: '#10B981' }
          ].map((col) => {
            const colItems = kanbanColumns[col.key] || [];
            return (
              <div
                key={col.key}
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '750px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `3px solid ${col.color}`
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F1F5F9' }}>{col.label}</span>
                  <Badge variant="neutral">{colItems.length}</Badge>
                </div>

                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {colItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.75rem', color: '#64748B' }}>
                      No organizations in this stage.
                    </div>
                  ) : (
                    colItems.map((partner) => (
                      <Card
                        key={partner.partnerId}
                        style={{
                          padding: '12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer'
                        }}
                        onClick={() => openDetailDrawer(partner.partnerId)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>
                            {partner.tradeName}
                          </span>
                          <Badge variant="neutral">{partner.partnerType}</Badge>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                          {partner.subscription?.planName || 'Standard'} • ₹{(partner.subscription?.annualBasePriceInr || 6000).toLocaleString('en-IN')}/yr
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: (partner.license?.daysRemaining ?? 0) <= 30 ? '#F87171' : '#38BDF8' }}>
                            ⏳ {partner.license?.daysRemaining ?? 0} days remaining
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: partner.paymentStatus === 'PAID' ? '#10B981' : '#F59E0B' }}>
                            {partner.paymentStatus}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setGraceModalPartner(partner);
                            }}
                            style={{ flex: 1 }}
                          >
                            Grace
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setOfflineModalPartner(partner);
                            }}
                            style={{ flex: 1 }}
                          >
                            Offline Pay
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 7-Section Commercial Detail Drawer (Section 24) ─────────── */}
      {detailPartnerId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '620px',
            backgroundColor: '#0F172A',
            borderLeft: '1px solid #38BDF8',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1E293B'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                📁 360° Commercial Dossier
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                {detailData?.partner?.tradeName || 'Loading partner details...'}
              </p>
            </div>
            <button
              onClick={() => setDetailPartnerId(null)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>

          {/* Drawer Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1E293B', backgroundColor: '#0F172A', overflowX: 'auto' }}>
            {[
              { key: 'IDENTITY', label: 'Identity' },
              { key: 'COMMERCIAL', label: 'Commercial & GST' },
              { key: 'LICENSE', label: 'License' },
              { key: 'PAYMENTS', label: 'Payments' },
              { key: 'INVOICES', label: 'Invoices' },
              { key: 'ENTITLEMENTS', label: 'Entitlements' },
              { key: 'AUDIT', label: 'Audit Trail' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveDetailTab(tab.key as any)}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.75rem',
                  fontWeight: activeDetailTab === tab.key ? 800 : 500,
                  color: activeDetailTab === tab.key ? '#38BDF8' : '#94A3B8',
                  borderBottom: activeDetailTab === tab.key ? '2px solid #38BDF8' : 'none',
                  backgroundColor: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {isLoadingDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spinner size="lg" />
              </div>
            ) : !detailData ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#EF4444' }}>
                Failed to load dossier data.
              </div>
            ) : (
              <div>
                {/* TAB 1: Partner Identity */}
                {activeDetailTab === 'IDENTITY' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Card style={{ padding: '16px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px' }}>ORGANIZATION PROFILE</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Trade Name:</span>
                          <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{detailData.partner.tradeName}</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Legal Name:</span>
                          <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{detailData.partner.legalName}</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Partner Type:</span>
                          <div><Badge variant="neutral">{detailData.partner.partnerType}</Badge></div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Verification:</span>
                          <div><Badge variant={detailData.partner.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>{detailData.partner.verificationStatus}</Badge></div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>GSTIN:</span>
                          <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{detailData.partner.gstin || 'Not Registered / Composition'}</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Assigned HQ Owner:</span>
                          <div style={{ fontWeight: 700, color: '#38BDF8' }}>{detailData.partner.assignedHqOwner}</div>
                        </div>
                      </div>
                    </Card>

                    <Card style={{ padding: '16px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px' }}>PRIMARY CONTACT</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Contact Person:</span>
                          <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{detailData.partner.primaryContactName}</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Phone:</span>
                          <div style={{ color: '#F1F5F9' }}>{detailData.partner.primaryContactPhone}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#94A3B8' }}>Email:</span>
                          <div style={{ color: '#38BDF8' }}>{detailData.partner.primaryContactEmail}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* TAB 2: Commercial & Pricing */}
                {activeDetailTab === 'COMMERCIAL' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Card style={{ padding: '16px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px' }}>PLAN &amp; PRICE VERSION</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Plan:</span>
                          <div style={{ fontWeight: 800, color: '#F8FAFC' }}>{detailData.commercial.plan?.name || 'N/A'}</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Plan Code:</span>
                          <div style={{ fontWeight: 700, color: '#CBD5E1' }}>{detailData.commercial.plan?.code || 'N/A'}</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Price Version:</span>
                          <div><Badge variant="primary">{detailData.commercial.priceVersion?.versionNumber || 'v1.0'}</Badge></div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Annual Base Price:</span>
                          <div style={{ fontWeight: 800, color: '#38BDF8' }}>₹{(detailData.commercial.priceVersion?.annualBasePriceInr || 6000).toLocaleString('en-IN')}/year</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Tax Structure:</span>
                          <div style={{ color: '#A7F3D0' }}>18% GST Inclusive (SAC {detailData.commercial.priceVersion?.sacCode || '998313'})</div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>365-Day Free Granted:</span>
                          <div>{detailData.commercial.subscription?.isFirstYearFree ? <Badge variant="success">YES</Badge> : <Badge variant="neutral">NO</Badge>}</div>
                        </div>
                      </div>
                    </Card>

                    {detailData.commercial.activeOverride && (
                      <Card style={{ padding: '16px', backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid #EAB308' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FACC15', marginBottom: '6px' }}>⭐ NEGOTIATED ENTERPRISE OVERRIDE ACTIVE</div>
                        <div style={{ fontSize: '0.8rem', color: '#FEF08A' }}>
                          Type: {detailData.commercial.activeOverride.overrideType} • Value: {detailData.commercial.activeOverride.overrideValue}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                          Reason: {detailData.commercial.activeOverride.reason}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* TAB 3: License */}
                {activeDetailTab === 'LICENSE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Card style={{ padding: '16px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px' }}>CRYPTOGRAPHIC LICENSE ENFORCEMENT</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: '#94A3B8' }}>License Key:</span>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F8FAFC', wordBreak: 'break-all' }}>
                            {detailData.license?.licenseKey || 'NO_KEY_ISSUED'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Status:</span>
                          <div>
                            <Badge variant={detailData.license?.status === 'ACTIVE' ? 'success' : 'warning'}>
                              {detailData.license?.status || 'UNKNOWN'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Days Remaining:</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (detailData.license?.daysRemaining ?? 0) <= 30 ? '#F87171' : '#38BDF8' }}>
                            {detailData.license?.daysRemaining ?? 0} days
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Expiry Date:</span>
                          <div style={{ fontWeight: 700, color: '#F1F5F9' }}>
                            {detailData.license?.expiryDate ? new Date(detailData.license.expiryDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Grace Period End:</span>
                          <div style={{ fontWeight: 700, color: '#FB923C' }}>
                            {detailData.license?.gracePeriodEnd ? new Date(detailData.license.gracePeriodEnd).toLocaleDateString() : 'None active'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Operational Access:</span>
                          <div>
                            {detailData.license?.isAccessAllowed ? (
                              <Badge variant="success">ALLOWED</Badge>
                            ) : (
                              <Badge variant="danger">HARD LOCKED</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* TAB 4: Payments */}
                {activeDetailTab === 'PAYMENTS' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>ORDER SNAPSHOTS &amp; PAYMENTS</div>
                    {detailData.payments?.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                        No commercial checkout snapshots recorded.
                      </div>
                    ) : (
                      detailData.payments.map((snap: any) => (
                        <Card key={snap.id} style={{ padding: '12px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.85rem' }}>
                              ₹{snap.finalAmountInr.toLocaleString('en-IN')}
                            </span>
                            <Badge variant={snap.status === 'PAID' ? 'success' : snap.status === 'PENDING' ? 'warning' : 'danger'}>
                              {snap.status}
                            </Badge>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                            Duration: {snap.billingDurationYears} Year(s) • Taxable: ₹{snap.taxableAmountInr} • GST: ₹{snap.cgstAmountInr + snap.sgstAmountInr}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                            Order ID: {snap.metadata?.razorpayOrderId || snap.id} • {new Date(snap.createdAt).toLocaleDateString()}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: Invoices */}
                {activeDetailTab === 'INVOICES' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>B2B GST TAX INVOICES</div>
                    {detailData.invoices?.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                        No tax invoices generated yet.
                      </div>
                    ) : (
                      detailData.invoices.map((inv: any) => (
                        <Card key={inv.id} style={{ padding: '12px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: '0.85rem' }}>
                              {inv.invoiceNumber}
                            </span>
                            <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
                            Total: ₹{inv.totalAmount} • Issued: {new Date(inv.issueDate).toLocaleDateString()}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 6: Entitlements */}
                {activeDetailTab === 'ENTITLEMENTS' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>ACTIVE MODULES &amp; QUOTA LIMITS</div>
                    {detailData.entitlements?.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                        Standard operational modules active according to partner tier.
                      </div>
                    ) : (
                      detailData.entitlements.map((feat: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: '#1E293B',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.8rem' }}>{feat.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{feat.code} • {feat.category}</div>
                          </div>
                          <Badge variant="success">ENABLED</Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 7: Audit */}
                {activeDetailTab === 'AUDIT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F8FAFC' }}>COMMERCIAL AUDIT TRACES</div>
                    {detailData.auditLogs?.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                        No commercial administrative mutations recorded.
                      </div>
                    ) : (
                      detailData.auditLogs.map((log: any) => (
                        <Card key={log.id} style={{ padding: '12px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.8rem' }}>
                              {log.action}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                              {new Date(log.occurredAt).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
                            {log.reason}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                            Actor: {log.actorEmail}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal 1: Grace Period Extension ─────────────────────────── */}
      {graceModalPartner && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#0F172A',
              border: '1px solid #38BDF8',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 800 }}>
              ⏱️ Extend Grace Period
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Grant discretionary operational grace period to <strong>{graceModalPartner.tradeName}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  ADDITIONAL GRACE DAYS
                </label>
                <Select
                  value={graceDays.toString()}
                  onChange={(e) => setGraceDays(parseInt(e.target.value, 10))}
                  options={[
                    { value: '3', label: '+3 Days' },
                    { value: '7', label: '+7 Days (Standard)' },
                    { value: '14', label: '+14 Days (Extended)' },
                    { value: '30', label: '+30 Days (Maximum Policy Approval)' }
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  JUSTIFICATION / AUDIT REASON
                </label>
                <Input
                  value={graceReason}
                  onChange={(e) => setGraceReason(e.target.value)}
                  placeholder="e.g. Bank transfer in transit; Director requested 7 days"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button
                variant="ghost"
                onClick={() => setGraceModalPartner(null)}
                disabled={isSubmittingGrace}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExtendGraceSubmit}
                disabled={isSubmittingGrace}
              >
                {isSubmittingGrace ? 'Granting...' : 'Grant Grace Extension'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal 2: Offline Bank Settlement ────────────────────────── */}
      {offlineModalPartner && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0F172A',
              border: '1px solid #10B981',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 800 }}>
              🏦 Record Offline Bank Payment
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Reconcile offline bank transfer for <strong>{offlineModalPartner.tradeName}</strong>. Issues GST B2B invoice and extends license idempotently.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  PAYMENT METHOD
                </label>
                <Select
                  value={offlineMethod}
                  onChange={(e) => setOfflineMethod(e.target.value)}
                  options={[
                    { value: 'NEFT', label: 'NEFT (National Electronic Fund Transfer)' },
                    { value: 'RTGS', label: 'RTGS (Real Time Gross Settlement)' },
                    { value: 'DIRECT_BANK_TRANSFER', label: 'Direct IMPS / NetBanking Transfer' },
                    { value: 'CHEQUE', label: 'Bank Cheque / Demand Draft' },
                    { value: 'UPI_OFFLINE', label: 'Corporate UPI Transfer' }
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  BANK TRANSACTION REFERENCE / UTR NUMBER
                </label>
                <Input
                  value={offlineTxRef}
                  onChange={(e) => setOfflineTxRef(e.target.value)}
                  placeholder="e.g. HDFC2026092300084918 / UTR123456"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  PURCHASE DURATION
                </label>
                <Select
                  value={offlineDurationYears.toString()}
                  onChange={(e) => setOfflineDurationYears(parseInt(e.target.value, 10))}
                  options={[
                    { value: '1', label: '1 Year (Standard)' },
                    { value: '2', label: '2 Years (2% tenure discount)' },
                    { value: '3', label: '3 Years (10% tenure discount)' },
                    { value: '5', label: '5 Years (20% tenure discount)' }
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  SETTLEMENT NOTES
                </label>
                <Input
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="Notes for finance audit"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button
                variant="ghost"
                onClick={() => setOfflineModalPartner(null)}
                disabled={isSubmittingOffline}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRecordOfflineSubmit}
                disabled={isSubmittingOffline}
              >
                {isSubmittingOffline ? 'Settling...' : 'Reconcile & Extend License'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Drawer: Plan Management (Editable & Deletable Catalog) ─── */}
      {isPlanDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#0F172A',
            borderLeft: '1px solid #1E293B',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1E293B'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC' }}>
                ⚙️ Commercial Plan Governance
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Centrally edit plan prices with automated immutable price versioning
              </p>
            </div>
            <button
              onClick={() => setIsPlanDrawerOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8' }}>
              ACTIVE COMMERCIAL TIERS (GST-INCLUSIVE)
            </div>

            {catalogPlans.map((plan) => (
              <Card
                key={plan.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#1E293B',
                  border: editingPlanId === plan.id ? '2px solid #38BDF8' : '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {plan.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{plan.code}</span>
                  </div>
                  <Badge variant="primary">{plan.priceVersion || 'v1.0'}</Badge>
                </div>

                {editingPlanId === plan.id ? (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>PLAN NAME</label>
                      <Input
                        value={editingPlanName}
                        onChange={(e) => setEditingPlanName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>ANNUAL BASE PRICE (₹ GST INCL.)</label>
                      <Input
                        type="number"
                        value={editingPlanPrice.toString()}
                        onChange={(e) => setEditingPlanPrice(parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isSavingPlan}
                        onClick={() => handleUpdatePlan(plan.id)}
                      >
                        {isSavingPlan ? 'Saving...' : 'Save & Publish Price Version'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPlanId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>
                      ₹{plan.annualBasePriceInr.toLocaleString('en-IN')}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8' }}> / year</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingPlanId(plan.id);
                          setEditingPlanPrice(plan.annualBasePriceInr);
                          setEditingPlanName(plan.name);
                        }}
                      >
                        Edit Price
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: '#EF4444' }}
                        onClick={() => handleArchivePlan(plan.id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Drawer: Partner Types Catalog (Section 3) ────────────────── */}
      {isTypesDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#0F172A',
            borderLeft: '1px solid #1E293B',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1E293B'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC' }}>
                🏥 Partner Classifications Catalog
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                HQ Controllable Healthcare Partner Classifications
              </p>
            </div>
            <button
              onClick={() => setIsTypesDrawerOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card style={{ padding: '16px', backgroundColor: '#1E293B', border: '1px solid #38BDF8' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', marginBottom: '10px' }}>
                + ADD NEW PARTNER CLASSIFICATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>CODE (UPPERCASE)</label>
                  <Input
                    placeholder="e.g. DENTAL_CLINIC, AYUSH_HOSPITAL"
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>LABEL / NAME</label>
                  <Input
                    placeholder="e.g. Specialty Dental Clinic"
                    value={newTypeLabel}
                    onChange={(e) => setNewTypeLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>ICON</label>
                  <Input
                    placeholder="e.g. 🦷, 🌿, 🏥"
                    value={newTypeIcon}
                    onChange={(e) => setNewTypeIcon(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>DEFAULT PLAN CODE</label>
                  <Input
                    placeholder="e.g. PLAN_SOLO_CLINIC_ANNUAL"
                    value={newTypeDefaultPlan}
                    onChange={(e) => setNewTypeDefaultPlan(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleCreatePartnerType}
                  disabled={isSavingType}
                  style={{ marginTop: '6px' }}
                >
                  {isSavingType ? 'Creating...' : 'Create Classification'}
                </Button>
              </div>
            </Card>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginTop: '10px' }}>
              EXISTING PARTNER TYPES
            </div>

            {partnerTypesList.map((pt) => (
              <Card key={pt.id} style={{ padding: '12px 16px', backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{pt.icon || '🏥'}</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.85rem' }}>{pt.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{pt.code} • {pt.category}</div>
                    </div>
                  </div>
                  <Badge variant={pt.status === 'ACTIVE' ? 'success' : 'neutral'}>{pt.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
